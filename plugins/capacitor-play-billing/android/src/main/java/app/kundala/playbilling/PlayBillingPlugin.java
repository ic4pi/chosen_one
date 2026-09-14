package app.kundala.playbilling;

import android.app.Activity;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Talks straight to Google Play Billing on-device. Kundala ships no backend, so
 * there is no receipt server: a purchase is acknowledged locally and Play's own
 * account is the record of truth (that's what restorePurchases() reads back).
 *
 * Registered as "Purchases" — the name web/js/billing.js already looks for.
 */
@CapacitorPlugin(name = "Purchases")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener, BillingClientStateListener {

    private BillingClient billingClient;
    private volatile boolean isReady = false;
    private final List<Runnable> pendingActions = new ArrayList<>();
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
        billingClient.startConnection(this);
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productIdentifier", call.getString("productId"));
        if (productId == null || productId.isEmpty()) {
            call.reject("productIdentifier is required");
            return;
        }
        ensureReady(() -> startPurchase(productId, call));
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        ensureReady(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

            billingClient.queryPurchasesAsync(params, (billingResult, purchasesList) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject(billingResult.getDebugMessage());
                    return;
                }

                JSArray transactions = new JSArray();
                for (Purchase purchase : purchasesList) {
                    if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                    acknowledgeIfNeeded(purchase, () -> {});
                    for (String productId : purchase.getProducts()) {
                        JSObject t = new JSObject();
                        t.put("productIdentifier", productId);
                        transactions.put(t);
                    }
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("transactions", transactions);
                call.resolve(ret);
            });
        });
    }

    private void startPurchase(String productId, PluginCall call) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            ))
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, queryProductDetailsResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(billingResult.getDebugMessage());
                return;
            }

            List<ProductDetails> list = queryProductDetailsResult.getProductDetailsList();
            if (list == null || list.isEmpty()) {
                call.reject("Product not found in Play Console: " + productId);
                return;
            }

            ProductDetails productDetails = list.get(0);
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails)
                        .build()
                ))
                .build();

            Activity activity = getActivity();
            if (activity == null) {
                call.reject("No activity to launch the purchase flow from");
                return;
            }

            pendingPurchaseCall = call;
            activity.runOnUiThread(() -> {
                BillingResult launchResult = billingClient.launchBillingFlow(activity, flowParams);
                // A synchronous failure here (e.g. item already owned) never reaches
                // onPurchasesUpdated, so the call must be settled right here or the
                // JS promise hangs forever.
                if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    pendingPurchaseCall = null;
                    call.reject(launchResult.getDebugMessage());
                }
            });
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, @Nullable List<Purchase> purchases) {
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        if (call == null) return;

        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            handlePurchase(purchases.get(0), call);
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("reason", "cancelled");
            call.resolve(ret);
        } else {
            call.reject(billingResult.getDebugMessage() != null ? billingResult.getDebugMessage() : "Purchase failed");
        }
    }

    private void handlePurchase(Purchase purchase, PluginCall call) {
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("reason", "pending");
            call.resolve(ret);
            return;
        }
        acknowledgeIfNeeded(purchase, () -> {
            JSObject transaction = new JSObject();
            transaction.put("state", "purchased");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("transaction", transaction);
            List<String> products = purchase.getProducts();
            if (products != null && !products.isEmpty()) {
                ret.put("productIdentifier", products.get(0));
            }
            call.resolve(ret);
        });
    }

    /** Non-consumable, one-time unlock: acknowledge, never consume. */
    private void acknowledgeIfNeeded(Purchase purchase, Runnable then) {
        if (purchase.isAcknowledged()) {
            then.run();
            return;
        }
        AcknowledgePurchaseParams ackParams = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.getPurchaseToken())
            .build();
        billingClient.acknowledgePurchase(ackParams, ackResult -> then.run());
    }

    private void ensureReady(Runnable action) {
        if (isReady) {
            action.run();
            return;
        }
        synchronized (pendingActions) {
            pendingActions.add(action);
        }
        if (!billingClient.isReady()) {
            billingClient.startConnection(this);
        }
    }

    @Override
    public void onBillingSetupFinished(BillingResult billingResult) {
        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
        isReady = true;
        List<Runnable> toRun;
        synchronized (pendingActions) {
            toRun = new ArrayList<>(pendingActions);
            pendingActions.clear();
        }
        for (Runnable action : toRun) action.run();
    }

    @Override
    public void onBillingServiceDisconnected() {
        isReady = false;
    }
}
