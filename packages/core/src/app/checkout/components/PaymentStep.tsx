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
    return <CheckoutStep
        {...step}
        heading={<TranslatedString id="payment.payment_heading" />}
        key={step.type}
        onEdit={onEdit}
        onExpanded={onExpanded}
    >
        <LazyContainer loadingSkeleton={<ChecklistSkeleton />}>
            <PayWithEvo />
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
        </LazyContainer>
    </CheckoutStep>
}

const PayWithEvo = () => {
    const [evoSessionId, setEvoSessionId] = useState(null);
    const checkout = useCheckout();

    useEffect(() => {

        const timestampInMilliseconds = Date.now();
        const checkoutData = checkout.checkoutState.data.getCheckout();
        
        if (checkoutData) {

            console.log('checkoutData: ');
            console.log(checkoutData);

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
        
    }, []);

    const openEvoPaymentPage = () => {
        if (!evoSessionId) {
            console.log('No session');
            return;
        }
        window.location.href = 'https://evopaymentsmexico.gateway.mastercard.com/checkout/pay/'+evoSessionId+'?checkoutVersion=1.0.0'
    }
    return (
        <div>
            <input style={{ marginTop: '20px' }} type="button" value="Pay with EVO" onClick={openEvoPaymentPage} />
        </div>
    )
}

export default PaymentStep;

