import Api from "./Api";


export const  checkSubscription = () => Api.get(`/payment/subscription/active`).then(res => res.data);

export const updateUserSubscription = (paymentId: string, subscriptionData: { statut: string }) => 
  Api.patch(`/payment/${paymentId}`, subscriptionData).then(res => res.data);