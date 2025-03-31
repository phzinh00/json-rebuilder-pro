import { set, get, cloneDeep } from "lodash";

export interface EditableField {
  type: string;
  path: string;
  label?: string;
  value: string | null;
}

// Process the original Elementor JSON to extract editable fields
export const extractEditableFields = (json: any): EditableField[] => {
  try {
    const result: EditableField[] = [];
    
    // Process widgets recursively
    const processWidgets = (widgets: any[], basePath: string = "") => {
      if (!Array.isArray(widgets)) return;
      
      widgets.forEach((widget, index) => {
        // Construir o caminho corretamente
        const currentPath = basePath ? `${basePath}[${index}]` : `[${index}]`;
        
        // Check widget type
        if (widget.widgetType) {
          // Skip dividers and widgets without meaningful content
          if (widget.widgetType === "divider" || widget.widgetType === "spacer") {
            return;
          }

          // Process each type of widget and its editable fields
          switch (widget.widgetType) {
            case "heading":
              if (widget.settings?.title && widget.settings.title.trim() !== "") {
                result.push({
                  type: "heading",
                  path: `${currentPath}.settings.title`,
                  value: widget.settings.title
                });
              }
              break;
              
            case "text-editor":
              if (widget.settings?.editor && widget.settings.editor.trim() !== "") {
                result.push({
                  type: "text-editor",
                  path: `${currentPath}.settings.editor`,
                  value: widget.settings.editor
                });
              }
              break;
              
            case "button":
              if (widget.settings?.text && widget.settings.text.trim() !== "") {
                result.push({
                  type: "button",
                  path: `${currentPath}.settings.text`,
                  value: widget.settings.text
                });
              }
              break;
              
            default:
              // Generic search for common fields in other widget types
              if (widget.settings) {
                // Check for common field patterns
                for (const [key, value] of Object.entries(widget.settings)) {
                  if (
                    typeof value === "string" && 
                    ["title", "text", "content", "description", "caption"].includes(key) &&
                    value.trim() !== ""
                  ) {
                    result.push({
                      type: key,
                      path: `${currentPath}.settings.${key}`,
                      value: value
                    });
                  }
                }
              }
              break;
          }
        }
        
        // Recursively process inner sections or columns
        if (Array.isArray(widget.elements)) {
          processWidgets(widget.elements, `${currentPath}.elements`);
        }
        if (Array.isArray(widget.widgets)) {
          processWidgets(widget.widgets, `${currentPath}.widgets`);
        }
      });
    };
    
    // Start processing from the top level
    if (Array.isArray(json.widgets)) {
      processWidgets(json.widgets, "widgets");
    } else if (Array.isArray(json.elements)) {
      processWidgets(json.elements, "elements");
    }
    
    return result;
  } catch (error) {
    console.error("Error extracting editable fields:", error);
    throw new Error("Failed to extract editable fields from JSON");
  }
};

// Função auxiliar para resolver paths
const resolvePath = (path: string): string => {
  // Converte expressões como widgets[0] para widgets.0
  return path.replace(/\[(\d+)\]/g, '.$1');
};

// Rebuild the original JSON with updated values
export const rebuildJsonWithUpdatedFields = (
  originalJson: any, 
  updatedFields: EditableField[]
): any => {
  try {
    // Usar cloneDeep do lodash para garantir uma cópia profunda
    const resultJson = cloneDeep(originalJson);
    
    // Update each field in the JSON
    updatedFields.forEach(field => {
      try {
        // Resolver e normalizar o path
        const normalizedPath = resolvePath(field.path);
        
        console.log(`Tentando atualizar: ${normalizedPath} com valor: ${field.value}`);
        
        // Verificar caminho em diferentes formatos
        if (get(resultJson, normalizedPath) !== undefined) {
          set(resultJson, normalizedPath, field.value);
          console.log(`✓ Campo atualizado com sucesso: ${normalizedPath}`);
        } else {
          // Tentar encontrar o caminho pai
          const pathParts = normalizedPath.split('.');
          let testPath = '';
          let foundPath = false;
          
          // Testar progressivamente partes do caminho para encontrar onde falha
          for (let i = 0; i < pathParts.length; i++) {
            testPath = pathParts.slice(0, i + 1).join('.');
            if (get(resultJson, testPath) === undefined) {
              console.warn(`Parte do caminho não encontrada: ${testPath}`);
              
              // Verificar se podemos criar esta parte
              const parentPath = pathParts.slice(0, i).join('.');
              const parent = get(resultJson, parentPath);
              
              if (parent && typeof parent === 'object') {
                // Se o índice for numérico, garantir que temos um array
                const key = pathParts[i];
                if (!isNaN(parseInt(key))) {
                  if (!Array.isArray(parent)) {
                    console.warn(`Pai não é um array para índice: ${key}`);
                    break;
                  }
                }
                
                // Criar valor padrão (vazio) para o caminho que falta
                const defaultValue = !isNaN(parseInt(pathParts[i+1] || '')) ? [] : {};
                set(resultJson, testPath, defaultValue);
                console.log(`Criado valor padrão em: ${testPath}`);
              } else {
                break;
              }
            }
          }
          
          // Tentar definir o valor no caminho completo após correções
          try {
            set(resultJson, normalizedPath, field.value);
            console.log(`✓ Campo criado e atualizado: ${normalizedPath}`);
          } catch (e) {
            console.error(`Impossível atualizar: ${normalizedPath}`, e);
          }
        }
      } catch (e) {
        console.error(`Erro ao atualizar campo em: ${field.path}`, e);
      }
    });
    
    return resultJson;
  } catch (error) {
    console.error("Error rebuilding JSON:", error);
    throw new Error("Failed to rebuild JSON with updated fields");
  }
};

// Validate if the string is a valid JSON
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// Função de teste para verificar se a extração e reconstrução funcionam corretamente
export const testJsonProcessing = (json: any): void => {
  try {
    console.log("Iniciando teste de processamento JSON...");
    
    // 1. Extrair campos editáveis
    const fields = extractEditableFields(json);
    console.log(`Extraídos ${fields.length} campos editáveis`);
    
    // Mostrar os campos extraídos
    fields.forEach((field, index) => {
      console.log(`Campo ${index+1}: ${field.type} - ${field.path} = "${field.value}"`);
    });
    
    // 2. Modificar alguns campos para teste
    if (fields.length > 0) {
      const modifiedFields = fields.map(field => ({
        ...field,
        value: `${field.value} (MODIFICADO)`
      }));
      
      // 3. Reconstruir o JSON com os campos modificados
      const rebuiltJson = rebuildJsonWithUpdatedFields(json, modifiedFields);
      
      // 4. Extrair novamente para verificar se as modificações persistiram
      const newFields = extractEditableFields(rebuiltJson);
      
      // Verificar se os valores modificados estão presentes
      let allUpdated = true;
      newFields.forEach((field, index) => {
        const modified = field.value && field.value.includes("(MODIFICADO)");
        console.log(`Campo ${index+1} atualizado: ${modified ? "✓" : "✗"} - "${field.value}"`);
        if (!modified) allUpdated = false;
      });
      
      console.log(`Teste concluído. Todos os campos atualizados: ${allUpdated ? "SIM" : "NÃO"}`);
    }
  } catch (error) {
    console.error("Erro durante o teste:", error);
  }
};