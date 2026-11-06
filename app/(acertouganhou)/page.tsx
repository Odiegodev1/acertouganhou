import { auth } from "@/lib/auth";
import { HeaderComponents } from "./components/HeaderComponents";
import { InputPremio } from "./components/InputPremeio";
import { LaoyutPremios } from "./components/LaoyutPremios";
export const instant = false
export default async function Page(){
    const session = await auth()
    
    return(
        <div className="flex  flex-col gap-2 w-full  mx-auto max-w-7xl  min-h-screen">
      <HeaderComponents id={session?.user?.id as ""} img={session?.user?.image as ""} name={session?.user?.name as ""} />
          <main className="p-4 space-y-10">
             <InputPremio />
             <LaoyutPremios />
          </main>
        </div>
    )
}