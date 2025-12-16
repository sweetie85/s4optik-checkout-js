import type { Cart, Consignment } from '@bigcommerce/checkout-sdk/essential';
import React, { useEffect,useState,type  ReactElement } from 'react';

import type { ErrorLogger } from '@bigcommerce/checkout/error-handling-utils';
import { TranslatedString } from '@bigcommerce/checkout/locale';
import { ChecklistSkeleton, LazyContainer } from '@bigcommerce/checkout/ui';

import { type PaymentProps } from '../../payment';
import CheckoutStep from '../CheckoutStep';
import type CheckoutStepStatus from '../CheckoutStepStatus';
import type CheckoutStepType from '../CheckoutStepType';
import { useCheckout } from '@bigcommerce/checkout/contexts';


export interface PaymentStepProps extends PaymentProps {
    step: CheckoutStepStatus;
    cart?: Cart;
    consignments?: Consignment[];
    errorLogger: ErrorLogger;
    onEdit(type: CheckoutStepType): void;
    onExpanded(type: CheckoutStepType): void;
}

const PaymentStep = ({
    step,
    onEdit,
    onExpanded,
}: PaymentStepProps): ReactElement => {
    const [evoSessionId, setEvoSessionId] = useState(null);
    const [evoResultIndicator, setEvoResultIndicator] = useState<string | null>(null);
    const checkout = useCheckout();

    useEffect(() => {

        const timestampInMilliseconds = Date.now();
        const checkoutData = checkout.checkoutState.data.getCheckout();

        if (checkoutData) {

            const params = `checkout_id=${checkoutData.id}&cart_total=${checkoutData.grandTotal}&time=${timestampInMilliseconds}`;

            fetch(`https://payment.s4optik.mx/evo/create-session.php?${params}`)
                .then((response) => response.json())
                .then((response) => {
                    console.log('response: ');
                    console.log(response);

                    if (response.result && response.result == 'SUCCESS') {
                        setEvoSessionId(response.session.id);
                    } else {
                        console.log('Something is wrong while creating payment session!');
                    }
                });
        }

        const urlParams = new URLSearchParams(window.location.search);
        const resultIndicator = urlParams.get("resultIndicator");
        // const sessionVersion = params.get("sessionVersion");
        setEvoResultIndicator(resultIndicator);

        if (resultIndicator && checkoutData) {
            // checkout.checkoutService.loadOrder(checkoutData.id);
            // checkout.checkoutService.finalizeOrderIfNeeded();
            try {

                const params = `checkout_id=${checkoutData.id}&cart_total=${checkoutData.grandTotal}&time=${timestampInMilliseconds}`;

                // Verify payment and create order
                fetch(`https://payment.s4optik.mx/evo/verify_payment_and_create_bc_order.php?${params}`)
                .then((response) => response.json())
                .then((response) => {
                    console.log('response: ');
                    console.log(response);

                    checkout.checkoutService.finalizeOrderIfNeeded().then(() => {
                        window.location.assign('/order-confirmation');
                    });
                });
            } catch (error) {
                console.log('finalizeOrderIfNeeded error: ');
                console.log(error);

                // if (error.type !== 'order_finalization_not_required') {
                //     throw error;
                // }
            }
        }   

        // const paymentData = {
        //     ccExpiry: {
        //         month: '1',
        //         year: '29'
        //     },
        //     ccName: 'Lalmani Dewangan',
        //     ccNumber: '512345xxxxxx0008'
        // } as CreditCardInstrument;

        // const orderPayemntBody = {
        //     methodId: 'custom',
        //     gatewayId: 'evo',
        //     paymentData: paymentData
        // } as OrderPaymentRequestBody;

        // checkout.checkoutService.submitOrder({ payment: orderPayemntBody });


        
    }, []);

    const openEvoPaymentPage = () => {
        if (!evoSessionId) {
            console.log('No session');
            return;
        }
        window.location.href = 'https://evopaymentsmexico.gateway.mastercard.com/checkout/pay/'+evoSessionId+'?checkoutVersion=1.0.0'
    }
    return <CheckoutStep
        {...step}
        heading={<TranslatedString id="payment.payment_heading" />}
        key={step.type}
        onEdit={onEdit}
        onExpanded={onExpanded}
    >
        {/* <h2>This is payment step</h2> */}
        <LazyContainer loadingSkeleton={<ChecklistSkeleton />}>
            <div><input style={{ marginTop: '20px' }} type="button" value="Pay with EVO" onClick={openEvoPaymentPage} /></div>

            {evoResultIndicator && <p style={{ marginTop: '5px'}}>Payment Result: {evoResultIndicator}</p>}
            {/* <Payment
                checkEmbeddedSupport={checkEmbeddedSupport}
                errorLogger={errorLogger}
                isEmbedded={isEmbedded()}
                isUsingMultiShipping={
                    cart && consignments ? isUsingMultiShipping(consignments, cart.lineItems) : false
                }
                onCartChangedError={onCartChangedError}
                onFinalize={onFinalize}
                onReady={onReady}
                onSubmit={onSubmit}
                onSubmitError={onSubmitError}
                onUnhandledError={onUnhandledError}
            /> */}
            {/* <h2>This is lazy payment</h2> */}
        </LazyContainer>
    </CheckoutStep>
}

export default PaymentStep;

