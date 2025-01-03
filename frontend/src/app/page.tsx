import Image from "next/image";
import SearchField from "@/components/SearchField/SearchField";

export default function Home() {
  return (
    <div className="container mx-auto px-10 py-10">
      <div className="flex py-5">
        <Image
            aria-hidden
            src="/logom.jpg"
            alt="Mathi Lab"
            width={100}
            height={100}
          />
          <div className="px-5 py-4">
            <p className="text-left capitalize font-bold text-4xl">mathi lab</p>
            <p>Uma ferramenta desenvolvida para resolução de problemas matemáticos. Saiba mais sobre o projeto em &nbsp;
              <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" 
                 target="_blank" 
                 href="https://github.com/diesousil/mathi-lab">https://github.com/diesousil/mathi-lab</a>
            </p>

          </div>
          
        
      </div>
      <div className="flex flex-col gap-8 row-start-1 items-center sm:items-start">
        <SearchField 
          placeholder="Informe o que você deseja que seja calculado:" 
        />
      </div>
      <div className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        Results
      </div>
    </div>
  );
}