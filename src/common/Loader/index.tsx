import { LoadingOverlay } from "@mantine/core";

const Loader = () => {
  return (
    <LoadingOverlay
         visible={true}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: '#8A2BE2', type: 'dots' }}
       />
  );
};

export default Loader;
