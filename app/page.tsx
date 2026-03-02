import { redirect } from "next/navigation";

/*export default async function Home() {
  redirect("/swap");
}*/

const dugu = "/swap"

export default async function HomePage(){
  redirect(dugu)
}