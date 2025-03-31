
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JsonTextArea from "./JsonTextArea";
import { useToast } from "@/components/ui/use-toast";
import { 
  extractEditableFields, 
  rebuildJsonWithUpdatedFields, 
  isValidJson,
  type EditableField 
} from "@/utils/jsonProcessor";

const JsonRebuildApp: React.FC = () => {
  // State for the original JSON input
  const [originalJson, setOriginalJson] = useState<string>("");
  // State for the parsed original JSON
  const [parsedOriginalJson, setParsedOriginalJson] = useState<any>(null);
  // State for the extracted fields (clean JSON)
  const [extractedFields, setExtractedFields] = useState<EditableField[]>([]);
  // State for the clean JSON as a string (for display and editing)
  const [cleanJsonString, setCleanJsonString] = useState<string>("");
  // State for the updated fields input
  const [updatedFieldsInput, setUpdatedFieldsInput] = useState<string>("");
  // State for the rebuilt JSON
  const [rebuiltJson, setRebuiltJson] = useState<string>("");
  // State for the active tab
  const [activeTab, setActiveTab] = useState<string>("extract");
  // State for errors
  const [errors, setErrors] = useState<string>("");

  const { toast } = useToast();

  // Load data from localStorage if available on component mount
  useEffect(() => {
    const savedOriginalJson = localStorage.getItem("elementor-original-json");
    const savedCleanJson = localStorage.getItem("elementor-clean-json");
    
    if (savedOriginalJson) {
      setOriginalJson(savedOriginalJson);
      try {
        setParsedOriginalJson(JSON.parse(savedOriginalJson));
      } catch (e) {
        console.error("Error parsing saved original JSON:", e);
      }
    }
    
    if (savedCleanJson) {
      setCleanJsonString(savedCleanJson);
      setUpdatedFieldsInput(savedCleanJson);
    }
  }, []);

  // Process the original JSON to extract editable fields
  const handleExtractFields = () => {
    if (!originalJson.trim()) {
      setErrors("Por favor, insira o JSON original do Elementor.");
      toast({
        title: "Erro",
        description: "Por favor, insira o JSON original do Elementor.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isValidJson(originalJson)) {
        setErrors("O JSON inserido não é válido. Verifique a formatação.");
        toast({
          title: "Erro",
          description: "O JSON inserido não é válido. Verifique a formatação.",
          variant: "destructive",
        });
        return;
      }

      const parsed = JSON.parse(originalJson);
      setParsedOriginalJson(parsed);
      
      // Extract editable fields
      const fields = extractEditableFields(parsed);
      setExtractedFields(fields);
      
      // Convert the extracted fields to a formatted JSON string
      const cleanJson = JSON.stringify(fields, null, 2);
      setCleanJsonString(cleanJson);
      setUpdatedFieldsInput(cleanJson); // Pre-fill the input for rebuilding
      
      // Clear any previous errors
      setErrors("");
      
      // Save to localStorage for persistence
      localStorage.setItem("elementor-original-json", originalJson);
      localStorage.setItem("elementor-clean-json", cleanJson);
      
      // Show success message
      toast({
        title: "Sucesso!",
        description: `${fields.length} campos editáveis foram extraídos do JSON original.`,
      });
      
      // Switch to the rebuild tab if fields were found
      if (fields.length > 0) {
        setActiveTab("rebuild");
      }
    } catch (error) {
      console.error("Error processing JSON:", error);
      setErrors(`Erro ao processar o JSON: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Erro",
        description: `Erro ao processar o JSON: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Rebuild the original JSON with updated values
  const handleRebuildJson = () => {
    if (!parsedOriginalJson) {
      setErrors("JSON original não disponível. Por favor, execute o passo 1 primeiro.");
      toast({
        title: "Erro",
        description: "JSON original não disponível. Por favor, execute o passo 1 primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!updatedFieldsInput.trim()) {
      setErrors("Por favor, insira o JSON limpo preenchido.");
      toast({
        title: "Erro",
        description: "Por favor, insira o JSON limpo preenchido.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isValidJson(updatedFieldsInput)) {
        setErrors("O JSON preenchido não é válido. Verifique a formatação.");
        toast({
          title: "Erro",
          description: "O JSON preenchido não é válido. Verifique a formatação.",
          variant: "destructive",
        });
        return;
      }

      // Parse the updated fields
      const updatedFields: EditableField[] = JSON.parse(updatedFieldsInput);
      
      // Rebuild the original JSON with updated values
      const rebuilt = rebuildJsonWithUpdatedFields(parsedOriginalJson, updatedFields);
      
      // Convert the rebuilt JSON to a formatted string
      const rebuiltJsonString = JSON.stringify(rebuilt, null, 2);
      setRebuiltJson(rebuiltJsonString);
      
      // Clear any previous errors
      setErrors("");
      
      // Show success message
      toast({
        title: "Sucesso!",
        description: "JSON reconstruído com os valores atualizados.",
      });
      
      // Switch to the result tab
      setActiveTab("result");
    } catch (error) {
      console.error("Error rebuilding JSON:", error);
      setErrors(`Erro ao reconstruir o JSON: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Erro",
        description: `Erro ao reconstruir o JSON: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      <Card className="w-full bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
          <CardTitle className="text-2xl">JSON Rebuilder Pro para Elementor</CardTitle>
          <CardDescription className="text-white/90">
            Extraia, edite e reconstrua JSON do Elementor com facilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="extract" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="extract">1. Extrair Campos</TabsTrigger>
              <TabsTrigger value="rebuild">2. Preencher & Reconstruir</TabsTrigger>
              <TabsTrigger value="result">3. Resultado Final</TabsTrigger>
            </TabsList>

            <TabsContent value="extract" className="space-y-4">
              <div className="space-y-6">
                <JsonTextArea
                  id="jsonOriginal"
                  value={originalJson}
                  onChange={setOriginalJson}
                  label="Cole o JSON original do Elementor"
                  placeholder="Cole o JSON exportado do Elementor aqui..."
                  height="h-64"
                />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleExtractFields} 
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    Extrair Campos Editáveis
                  </Button>
                </div>

                {cleanJsonString && (
                  <JsonTextArea
                    id="jsonLimpo"
                    value={cleanJsonString}
                    label="Campos editáveis extraídos"
                    readOnly
                    height="h-64"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="rebuild" className="space-y-4">
              <div className="space-y-6">
                <JsonTextArea
                  id="jsonPreenchido"
                  value={updatedFieldsInput}
                  onChange={setUpdatedFieldsInput}
                  label="Cole o JSON com campos preenchidos"
                  placeholder="Cole aqui o JSON limpo com os novos valores preenchidos..."
                  height="h-96"
                />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleRebuildJson}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    Reconstruir JSON Completo
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result" className="space-y-4">
              {rebuiltJson ? (
                <JsonTextArea
                  id="jsonFinal"
                  value={rebuiltJson}
                  label="JSON Final (pronto para importação no Elementor)"
                  readOnly
                  height="h-96"
                />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Preencha os campos nas etapas anteriores para ver o resultado aqui.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {errors && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {errors}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonRebuildApp;
