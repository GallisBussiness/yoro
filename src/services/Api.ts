import axios from "axios";
const Api = axios.create({
    baseURL: import.meta.env.VITE_BACKURL,
    withCredentials: true
  })
  // Api.interceptors.request.use(config => {
  //   const token = sessionStorage.getItem(import.meta.env.VITE_TOKENSTORAGENAME);
  //   return config;
  // });

  // Api.interceptors.response.use(function (response) {
  //   return response;
  // }, function (error) {
  //   if(error.response.status === 440){
      
      
  //   }
  //   if(error.response.status === 401 || error.response.status === 500){
  //     window.location.href = "/auth/signin";
  //   }
  //   eturn Promise.reject(error);
  // });
export default Api;