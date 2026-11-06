export const instant = false
export default async function Page({
    params,
  }: {
    params: Promise<{ id: string }>

  })
   {
    const {id} = await params

    return(
        <div>
            <h1>{id}</h1>
        </div>
    )
}