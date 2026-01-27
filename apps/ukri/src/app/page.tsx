export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-8 sm:items-start">
        <h1 className="text-4xl font-bold">UKRI Compliance</h1>
        <p className="text-center text-lg sm:text-left">
          Welcome to the UKRI Compliance application.
        </p>
      </main>
      <footer className="row-start-3 flex flex-wrap items-center justify-center gap-6">
        <p className="text-sm text-gray-500">
          UKRI Compliance &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
