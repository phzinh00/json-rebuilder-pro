
import React, { useState } from "react";
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
import { ArrowRight, ChevronRight } from "lucide-react";

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
      <Card className="w-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-2xl font-light">JSON Rebuilder Pro</CardTitle>
          <CardDescription className="text-[#c8c8c9]">
            Extraia, edite e reconstrua JSON do Elementor com facilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="extract" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#f3f3f3]">
              <TabsTrigger 
                value="extract" 
                className="data-[state=active]:bg-black data-[state=active]:text-white"
              >
                1. Extrair Campos
              </TabsTrigger>
              <TabsTrigger 
                value="rebuild" 
                className="data-[state=active]:bg-black data-[state=active]:text-white"
              >
                2. Preencher & Reconstruir
              </TabsTrigger>
              <TabsTrigger 
                value="result" 
                className="data-[state=active]:bg-black data-[state=active]:text-white"
              >
                3. Resultado Final
              </TabsTrigger>
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
                    className="bg-black hover:bg-[#333] text-white transition-colors flex items-center gap-2 group"
                  >
                    Extrair Campos Editáveis
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                    className="bg-black hover:bg-[#333] text-white transition-colors flex items-center gap-2 group"
                  >
                    Reconstruir JSON Completo
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                <div className="text-center py-10 text-[#999] border border-dashed border-[#ccc] rounded-md">
                  <p>Preencha os campos nas etapas anteriores para ver o resultado aqui.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {errors && (
            <div className="mt-4 p-3 bg-[#fff0f0] border border-red-200 rounded text-red-600 text-sm">
              {errors}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonRebuildApp;
