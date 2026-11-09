import React from 'react';
import { X, BookOpen, Compass, Magnet, Zap, HelpCircle } from 'lucide-react';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Fisica del Campo Magnetico 2D
              </h3>
              <p className="text-xs text-slate-400">
                Guida interattiva ai principi fisici, linee di forza e sorgenti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-sky-400 flex items-center gap-2">
              <Compass className="w-4 h-4" /> 1. Linee di Campo e Vettore Induzione Magnetica (B)
            </h4>
            <p>
              Il campo magnetico è una grandezza vettoriale indicata con <strong className="text-white">B</strong>{' '}
              (misurata in Tesla nel Sistema Internazionale, o in Gauss dove 1 T = 10 000 G). In ogni punto dello spazio:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs">
              <li>
                <strong className="text-slate-100">Direzione e Verso:</strong> Il vettore B è tangente alla linea di campo in ciascun punto.
              </li>
              <li>
                <strong className="text-slate-100">Convenzione dei Poli:</strong> All'esterno del magnete le linee{' '}
                <span className="text-rose-400 font-semibold">escono dal polo Nord</span> ed{' '}
                <span className="text-sky-400 font-semibold">entrano nel polo Sud</span>.
              </li>
              <li>
                <strong className="text-slate-100">Densità delle Linee:</strong> Nelle zone in cui le linee sono fitte
                (vicino ai poli o nel traferro), il campo è più intenso; dove sono diradate, il campo è debole.
              </li>
              <li>
                <strong className="text-slate-100">Non Intersezione:</strong> Le linee di campo non si intersecano mai.
                Se lo facessero, nello stesso punto esisterebbero due diverse direzioni per il vettore B, il che è fisicamente impossibile.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h4 className="text-base font-semibold text-rose-400 flex items-center gap-2">
              <Magnet className="w-4 h-4" /> 2. Magnete a Barra e Magnete a Ferro di Cavallo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <span className="font-semibold text-slate-100">Magnete a Barra (Dipolo)</span>
                <p className="text-slate-400">
                  Presenta i due poli alle estremità opposte. A grande distanza, il campo diminuisce rapidamente con il cubo della distanza (1/r³). Se spezzato a metà, compaiono due nuovi poli completi (inesistenza del monopolo magnetico: ∇ · B = 0).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <span className="font-semibold text-slate-100">Magnete a Ferro di Cavallo</span>
                <p className="text-slate-400">
                  La caratteristica forma a 'U' porta i poli Nord e Sud l'uno di fronte all'altro. Nella fessura tra i due poli (traferro), le linee di forza sono parallele ed estremamente dense, generando un campo magnetico quasi uniforme e molto potente.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h4 className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> 3. Esperimento di Oersted e Legge di Biot-Savart
            </h4>
            <p className="text-xs">
              Nel 1820 Hans Christian Ørsted scoprì che un conduttore percorso da corrente elettrica devia l'ago di una bussola nelle vicinanze. Il campo magnetico generato da un filo rettilineo infinito ha linee di forza circolari e concentriche centrate sul filo.
            </p>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs space-y-1">
              <span className="font-semibold text-slate-100">Regola della Mano Destra:</span>
              <p className="text-slate-400">
                Punta il pollice della mano destra nella direzione della corrente (verso di te per ⊙, uscente dal monitor; verso l'interno per ⊗, entrante). Le altre quattro dita chiuse indicheranno il verso di rotazione delle linee di campo B.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h4 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> 4. Come Usare questo Simulatore
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li><strong className="text-slate-100">Trascina:</strong> Clicca e sposta qualsiasi magnete o filo sulla tela.</li>
              <li><strong className="text-slate-100">Ruota:</strong> Trascina la maniglia circolare azzurra collegata al magnete selezionato, oppure usa il cursore dei gradi nel pannello laterale.</li>
              <li><strong className="text-slate-100">Inverti:</strong> Clicca su &quot;Inverti Polarità&quot; per scambiare istantaneamente polo Nord e polo Sud.</li>
              <li><strong className="text-slate-100">Sonda Magnetica:</strong> Muovi la bussola di prova per leggere il valore esatto di |B| in ogni coordinata.</li>
              <li><strong className="text-slate-100">Linee Personalizzate:</strong> Fai Shift+Click in qualunque punto per tracciare una specifica linea di campo passante per quel punto.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
          >
            Chiudi Guida
          </button>
        </div>
      </div>
    </div>
  );
};
