
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface JsonTextAreaProps {
  id: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label: string;
  height?: string;
  readOnly?: boolean;
  showActions?: boolean;
}

const JsonTextArea: React.FC<JsonTextAreaProps> = ({
  id,
  value,
  onChange,
  placeholder = "Cole seu JSON aqui...",
  label,
  height = "h-64",
  readOnly = false,
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      navigator.clipboard.writeText(textareaRef.current.value);
      setCopied(true);
      toast({
        title: "Conteúdo copiado!",
        description: "O JSON foi copiado para sua área de transferência.",
        duration: 3000,
      });
    }
  };

  const handleDownload = () => {
    if (!value) return;
    
    const blob = new Blob([value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado!",
      description: "O arquivo JSON está sendo baixado.",
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-medium text-[#222222]">
          {label}
        </label>
        {showActions && value && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-xs border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-3 text-xs border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </Button>
          </div>
        )}
      </div>
      <div 
        className={`relative overflow-hidden rounded-md transition-all duration-300 ${hovered ? 'shadow-md' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${height} p-4 border border-[#ccc] rounded-md mono bg-white text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-300`}
          readOnly={readOnly}
        />
        {readOnly && (
          <div className="absolute top-0 right-0 m-2 opacity-0 transition-opacity duration-300 hover:opacity-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs bg-white/80 backdrop-blur-sm border-black text-black hover:bg-black hover:text-white"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonTextArea;
