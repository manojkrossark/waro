import StoreSpot from "@/components/dashboard/storespot";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
  title: "Store Spot ",
};
const index = () => {
  return (
    <Wrapper>
      <StoreSpot />
    </Wrapper>
  );
};

export default index;
