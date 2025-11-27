import React, { useState, useCallback } from 'react';
import { 
  Scissors, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Download,
  Layers
} from 'lucide-react';
import { Category, AppStep, ProcessingState } from './types';
import { ImageUploader } from './components/ImageUploader';
import { LoadingOverlay } from './components/LoadingOverlay';
import { generateTryOn, generateBackgroundChange } from './services/genai';

const App: React.FC = () => {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState<Category>(Category.FULL_LOOK);
  
  // Image States
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [upperImage, setUpperImage] = useState<string | null>(null); // Blusas
  const [lowerImage, setLowerImage] = useState<string | null>(null); // Calças
  const [accImage, setAccImage] = useState<string | null>(null);     // Acessórios

  const [resultImage, setResultImage] = useState<string | null>(null);
  const [bgPrompt, setBgPrompt] = useState<string>("");
  
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    message: ""
  });

  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);

  // --- Handlers ---

  const handleReset = () => {
    setStep(AppStep.UPLOAD);
    setResultImage(null);
    setBgPrompt("");
    // Keep inputs as user might want to reuse them
  };

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    // Optional: Clear garment images when switching categories if desired, 
    // currently keeping them allows for smoother UX if switching back and forth.
  };

  const handleTryOn = useCallback(async () => {
    if (!modelImage) return;

    // Validation: Check if at least one garment is selected based on category
    let hasGarment = false;
    if (activeCategory === Category.FULL_LOOK) {
      hasGarment = !!(upperImage || lowerImage || accImage);
    } else if (activeCategory === Category.SHIRTS) {
      hasGarment = !!upperImage;
    } else if (activeCategory === Category.PANTS) {
      hasGarment = !!lowerImage;
    } else if (activeCategory === Category.ACCESSORIES) {
      hasGarment = !!accImage;
    }

    if (!hasGarment) {
      alert("Por favor, carregue pelo menos uma peça de roupa para o look.");
      return;
    }

    setProcessing({ isProcessing: true, message: "Criando o look perfeito..." });
    
    try {
      // Prepare the selection object
      const selection = {
        upper: (activeCategory === Category.FULL_LOOK || activeCategory === Category.SHIRTS) ? upperImage : null,
        lower: (activeCategory === Category.FULL_LOOK || activeCategory === Category.PANTS) ? lowerImage : null,
        accessory: (activeCategory === Category.FULL_LOOK || activeCategory === Category.ACCESSORIES) ? accImage : null,
      };

      const generatedImage = await generateTryOn(modelImage, selection, activeCategory);
      setResultImage(generatedImage);
      setStep(AppStep.BACKGROUND);
    } catch (error) {
      alert("Falha ao gerar o look. Tente imagens mais claras.");
    } finally {
      setProcessing({ isProcessing: false, message: "" });
    }
  }, [modelImage, upperImage, lowerImage, accImage, activeCategory]);

  const handleBackgroundChange = useCallback(async () => {
    if (!resultImage || !bgPrompt.trim()) return;

    setProcessing({ isProcessing: true, message: "Transformando o ambiente..." });

    try {
      const newBgImage = await generateBackgroundChange(resultImage, bgPrompt);
      setResultImage(newBgImage);
      setStep(AppStep.RESULT);
    } catch (error) {
      alert("Falha ao alterar o fundo. Tente descrever de outra forma.");
    } finally {
      setProcessing({ isProcessing: false, message: "" });
    }
  }, [resultImage, bgPrompt]);

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `md-fashion-studio-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Renders ---

  const renderHeader = () => (
    <header className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-fashion-black text-white flex items-center justify-center rounded-sm">
            <span className="font-serif font-bold text-lg">MD</span>
          </div>
          <h1 className="font-serif text-xl font-bold tracking-tight text-fashion-black hidden sm:block">
            Fashion Studio
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-gray-400">
           <span className={step === AppStep.UPLOAD ? "text-fashion-gold" : ""}>1. LOOK</span>
           <span className={step === AppStep.BACKGROUND ? "text-fashion-gold" : ""}>2. CENÁRIO</span>
           <span className={step === AppStep.RESULT ? "text-fashion-gold" : ""}>3. FINAL</span>
        </div>
      </div>
    </header>
  );

  const renderCategoryTabs = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {Object.values(Category).map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategoryChange(cat)}
          disabled={step !== AppStep.UPLOAD}
          className={`
            px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold tracking-wider transition-all
            ${activeCategory === cat 
              ? 'bg-fashion-black text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}
            ${step !== AppStep.UPLOAD ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {cat === Category.FULL_LOOK && <Layers className="w-3 h-3 inline mr-2 -mt-1" />}
          {cat}
        </button>
      ))}
    </div>
  );

  const renderInputs = () => {
    // Determine which inputs to show based on category
    const showUpper = activeCategory === Category.FULL_LOOK || activeCategory === Category.SHIRTS;
    const showLower = activeCategory === Category.FULL_LOOK || activeCategory === Category.PANTS;
    const showAcc = activeCategory === Category.FULL_LOOK || activeCategory === Category.ACCESSORIES;

    // Layout Logic:
    // If FULL_LOOK, we use a grid where Model is prominent, and others are smaller or side-by-side.
    // If single category, we use a balanced 2-column grid.

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Model Section - Always Visible */}
        <div className={`${activeCategory === Category.FULL_LOOK ? 'md:col-span-5' : 'md:col-span-6'} transition-all`}>
          <ImageUploader 
            label="Modelo (Pessoa)" 
            image={modelImage} 
            onImageUpload={setModelImage} 
            aspectRatio="aspect-[3/4]"
          />
        </div>

        {/* Garments Section */}
        <div className={`${activeCategory === Category.FULL_LOOK ? 'md:col-span-7' : 'md:col-span-6'} flex flex-col gap-4`}>
          
          {activeCategory === Category.FULL_LOOK ? (
             // Grid layout for Full Look inputs
             <div className="grid grid-cols-2 gap-4 h-full content-start">
                <div className="col-span-2">
                   <div className="bg-gray-50 p-3 rounded-md border border-dashed border-gray-200 text-center text-xs text-gray-500 mb-2 font-serif italic">
                      Monte seu look completo abaixo
                   </div>
                </div>
                <div className="col-span-1">
                  <ImageUploader 
                    label="Blusa / Top" 
                    image={upperImage} 
                    onImageUpload={setUpperImage} 
                    aspectRatio="aspect-square"
                  />
                </div>
                <div className="col-span-1">
                  <ImageUploader 
                    label="Calça / Saia" 
                    image={lowerImage} 
                    onImageUpload={setLowerImage} 
                    aspectRatio="aspect-square"
                  />
                </div>
                <div className="col-span-2">
                   <ImageUploader 
                    label="Acessórios (Opcional)" 
                    image={accImage} 
                    onImageUpload={setAccImage} 
                    aspectRatio="aspect-[2/1]"
                  />
                </div>
             </div>
          ) : (
            // Single Item Layout
            <div className="h-full">
              {showUpper && (
                <ImageUploader 
                  label="Blusa / Top" 
                  image={upperImage} 
                  onImageUpload={setUpperImage} 
                  aspectRatio="aspect-[3/4]"
                />
              )}
              {showLower && (
                <ImageUploader 
                  label="Calça / Saia" 
                  image={lowerImage} 
                  onImageUpload={setLowerImage} 
                  aspectRatio="aspect-[3/4]"
                />
              )}
              {showAcc && (
                <ImageUploader 
                  label="Acessório" 
                  image={accImage} 
                  onImageUpload={setAccImage} 
                  aspectRatio="aspect-[3/4]"
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isReadyToTryOn = () => {
    if (!modelImage) return false;
    if (activeCategory === Category.FULL_LOOK) return !!(upperImage || lowerImage || accImage);
    if (activeCategory === Category.SHIRTS) return !!upperImage;
    if (activeCategory === Category.PANTS) return !!lowerImage;
    if (activeCategory === Category.ACCESSORIES) return !!accImage;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-fashion-black bg-fashion-cream">
      {renderHeader()}
      {processing.isProcessing && <LoadingOverlay message={processing.message} />}

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        
        {step === AppStep.UPLOAD && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl mb-2">Crie seu Look</h2>
              <p className="text-gray-500">Selecione o tipo de prova e carregue as fotos.</p>
            </div>

            {renderCategoryTabs()}
            {renderInputs()}

            <div className="flex justify-center mt-8">
              <button
                onClick={handleTryOn}
                disabled={!isReadyToTryOn()}
                className={`
                  flex items-center gap-3 px-8 py-4 bg-fashion-gold text-white rounded-sm font-bold tracking-widest uppercase shadow-md transition-all
                  ${!isReadyToTryOn() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b5952f] hover:shadow-xl hover:-translate-y-1'}
                `}
              >
                <Scissors className="w-5 h-5" />
                Experimentar Look
              </button>
            </div>
          </div>
        )}

        {step === AppStep.BACKGROUND && resultImage && (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <div className="text-center mb-6">
              <h2 className="font-serif text-3xl mb-2">Resultado Parcial</h2>
              <p className="text-gray-500">Agora, vamos ambientar a foto.</p>
            </div>

            <div className="bg-white p-4 shadow-sm rounded-lg mb-6">
               <img src={resultImage} alt="Try On Result" className="w-full rounded-md" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <label className="block text-sm font-bold text-fashion-gray mb-2 uppercase tracking-wider">
                 Descrição do Cenário
               </label>
               <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Ex: Um café parisiense ensolarado, interior de loja luxuosa..."
                    className="flex-grow p-3 border border-gray-300 rounded-sm focus:border-fashion-gold focus:ring-1 focus:ring-fashion-gold outline-none"
                 />
                 <button
                    onClick={handleBackgroundChange}
                    disabled={!bgPrompt.trim()}
                    className="px-6 bg-fashion-black text-white rounded-sm font-bold hover:bg-gray-800 disabled:opacity-50"
                 >
                    <Sparkles className="w-5 h-5" />
                 </button>
               </div>
            </div>

            <div className="mt-4 flex justify-between">
               <button onClick={handleReset} className="text-sm text-gray-500 hover:text-black underline">
                 Começar de novo
               </button>
               <button onClick={() => setStep(AppStep.RESULT)} className="text-sm text-fashion-gold font-bold hover:underline flex items-center gap-1">
                 Pular <ArrowRight className="w-3 h-3" />
               </button>
            </div>
          </div>
        )}

        {step === AppStep.RESULT && resultImage && (
          <div className="animate-fade-in-up max-w-xl mx-auto text-center">
            <h2 className="font-serif text-4xl mb-2 text-fashion-gold">Pronto!</h2>
            <p className="text-gray-500 mb-8">Seu look exclusivo MD Fashion Studio.</p>

            <div className="relative group bg-white p-2 shadow-2xl rotate-1 mb-8">
              <img src={resultImage} alt="Final" className="w-full" />
              <div className="absolute bottom-4 right-4 opacity-50">
                 <span className="font-serif text-white text-xl font-bold drop-shadow-md">MD Studio</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-sm font-bold hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Novo Look
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-fashion-black text-white rounded-sm font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                Salvar Imagem
              </button>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white py-6 border-t border-gray-100 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p className="font-serif">MD Fashion Studio &copy; {new Date().getFullYear()}</p>
          <p className="text-xs mt-1">Powered by Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default App;