import App from "@/components/App";
import { getShelfBooks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialBooks = await getShelfBooks();
  return <App initialBooks={initialBooks} />;
}
