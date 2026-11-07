import { auth } from "@/lib/auth";
import { HeaderComponents } from "../components/HeaderComponents";
import { LaoyutPremios } from "../components/LaoyutPremios";
import { DialogJogo } from "../components/DialogJogo";

export const instant = false
export default async function JogarPage(){
    const session = await auth()
    return(
        <div className="flex  flex-col gap-2 w-full  mx-auto max-w-7xl  min-h-screen">
        <HeaderComponents  id={session?.user?.id as ""} img={session?.user?.image as ""} name={session?.user?.name as ""} />
        <main className="p-4 space-y-10">
             <LaoyutPremios slug="Jogar agora" nome="Parou  Ganhou" />
             
          </main>
      </div>  

    )
}