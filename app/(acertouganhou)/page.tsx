import { HeaderComponents } from "./components/HeaderComponents";
import { InputPremio } from "./components/InputPremeio";
import { LaoyutPremios } from "./components/LaoyutPremios";

export default function Page(){
    return(
        <div className="flex  flex-col gap-2 w-full  mx-auto max-w-7xl  min-h-screen">
      <HeaderComponents />
          <main className="p-4 space-y-10">
             <InputPremio />
             <LaoyutPremios />
          </main>
        </div>
    )
}