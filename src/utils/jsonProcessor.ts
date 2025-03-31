import { set, get, cloneDeep } from "lodash";

export interface EditableField {
  type: string;
  path: string;
  label?: string;
  value: string | null;
}

/**
 * Extrai campos editáveis do JSON do Elementor
 * Suporta tanto widgets individuais quanto estruturas completas de página
 */
export const extractEditableFields = (json: any): EditableField[] => {
  try {
    const result: EditableField[] = [];
    
    // Verifica se estamos lidando com um widget individual ou uma estrutura completa
    if (isElementorWidget(json)) {
      // Caso 1: Processando um widget individual (como o exemplo fornecido)
      processWidget(json, "", result);
    } else if (json.widgets || json.elements) {
      // Caso 2: Processando uma estrutura completa com múltiplos widgets
      const processWidgets = (widgets: any[], basePath: string = "") => {
        if (!Array.isArray(widgets)) return;
        
        widgets.forEach((widget, index) => {
          const currentPath = basePath ? `${basePath}[${index}]` : `[${index}]`;
          processWidget(widget, currentPath, result);
          
          // Processa widgets aninhados
          if (Array.isArray(widget.elements)) {
            processWidgets(widget.elements, `${currentPath}.elements`);
          }
          if (Array.isArray(widget.widgets)) {
            processWidgets(widget.widgets, `${currentPath}.widgets`);
          }
        });
      };
      
      // Inicia o processamento a partir do nível superior
      if (Array.isArray(json.widgets)) {
        processWidgets(json.widgets, "widgets");
      } else if (Array.isArray(json.elements)) {
        processWidgets(json.elements, "elements");
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error extracting editable fields:", error);
    throw new Error("Failed to extract editable fields from JSON");
  }
};

/**
 * Verifica se o objeto é um widget do Elementor
 */
const isElementorWidget = (obj: any): boolean => {
  // Widgets do Elementor geralmente têm widgetType ou settings
  return (obj && (obj.widgetType || (obj.settings && typeof obj.settings === 'object')));
};

/**
 * Processa um único widget do Elementor para extrair campos editáveis
 */
const processWidget = (widget: any, path: string, result: EditableField[]) => {
  // Caso 1: Widget com tipo específico
  if (widget.widgetType) {
    // Padrão para widgets com widgetType
    switch (widget.widgetType) {
      case "heading":
        if (widget.settings?.title && widget.settings.title.trim() !== "") {
          result.push({
            type: "heading",
            path: path ? `${path}.settings.title` : `settings.title`,
            value: widget.settings.title
          });
        }
        break;
        
      case "text-editor":
        if (widget.settings?.editor && widget.settings.editor.trim() !== "") {
          result.push({
            type: "text-editor",
            path: path ? `${path}.settings.editor` : `settings.editor`,
            value: widget.settings.editor
          });
        }
        break;
        
      case "button":
        if (widget.settings?.text && widget.settings.text.trim() !== "") {
          result.push({
            type: "button",
            path: path ? `${path}.settings.text` : `settings.text`,
            value: widget.settings.text
          });
        }
        break;
        
      default:
        // Processamento genérico para outros tipos de widgets
        processGenericWidgetSettings(widget, path, result);
        break;
    }
  } 
  // Caso 2: Objeto que parece ser um widget mas sem widgetType (como o exemplo fornecido)
  else if (widget.title || widget.editor || widget.text) {
    // Widget sem widgetType explícito (como no exemplo)
    const keys = ["title", "editor", "text", "content", "description", "caption"];
    
    for (const key of keys) {
      if (widget[key] && typeof widget[key] === "string" && widget[key].trim() !== "") {
        result.push({
          type: key,
          path: path ? `${path}.${key}` : key,
          value: widget[key]
        });
      }
    }
  }
};

/**
 * Processa campos genéricos de configurações de widgets
 */
const processGenericWidgetSettings = (widget: any, path: string, result: EditableField[]) => {
  if (!widget.settings) return;
  
  // Campos comuns que geralmente contêm texto editável
  const commonFields = [
    "title", "text", "editor", "content", "description", 
    "caption", "button_text", "heading", "sub_heading"
  ];
  
  for (const field of commonFields) {
    if (widget.settings[field] && 
        typeof widget.settings[field] === "string" && 
        widget.settings[field].trim() !== "") {
      
      result.push({
        type: field,
        path: path ? `${path}.settings.${field}` : `settings.${field}`,
        value: widget.settings[field]
      });
    }
  }
};

/**
 * Atualiza o JSON original com os campos modificados
 */
export const rebuildJsonWithUpdatedFields = (
  originalJson: any, 
  updatedFields: EditableField[]
): any => {
  try {
    // Criar cópia profunda do JSON original
    const resultJson = cloneDeep(originalJson);
    
    // Atualizar cada campo
    for (const field of updatedFields) {
      try {
        // Normalizar o caminho (remover índices de array se for um widget individual)
        let fieldPath = field.path;
        
        // Se for um widget individual e o caminho começa com 'settings'
        if (isElementorWidget(originalJson) && fieldPath.startsWith('settings.')) {
          // Não precisamos modificar o caminho
        } 
        // Se o caminho tiver notação de array, precisamos ajustá-lo para o formato do lodash
        else if (fieldPath.includes('[')) {
          fieldPath = fieldPath.replace(/\[(\d+)\]/g, '.$1');
        }
        
        console.log(`Atualizando campo: ${fieldPath}`);
        
        // Verificar se o caminho existe
        if (get(resultJson, fieldPath) !== undefined) {
          set(resultJson, fieldPath, field.value);
          console.log(`Campo atualizado com sucesso: ${fieldPath}`);
        } else {
          console.warn(`Caminho não encontrado: ${fieldPath}`);
          
          // Tentar caminhos alternativos para esse campo
          const alternatePaths = getAlternatePaths(fieldPath);
          let updated = false;
          
          for (const altPath of alternatePaths) {
            if (get(resultJson, altPath) !== undefined) {
              set(resultJson, altPath, field.value);
              console.log(`Campo atualizado com caminho alternativo: ${altPath}`);
              updated = true;
              break;
            }
          }
          
          if (!updated) {
            console.error(`Não foi possível encontrar um caminho válido para: ${fieldPath}`);
          }
        }
      } catch (error) {
        console.error(`Erro ao atualizar campo: ${field.path}`, error);
      }
    }
    
    return resultJson;
  } catch (error) {
    console.error("Erro ao reconstruir JSON:", error);
    throw new Error("Falha ao reconstruir JSON com campos atualizados");
  }
};

/**
 * Gera caminhos alternativos para o mesmo campo
 */
const getAlternatePaths = (path: string): string[] => {
  const alternatePaths = [];
  
  // Remover 'settings.' do início
  if (path.startsWith('settings.')) {
    alternatePaths.push(path.substring(9));
  } else {
    // Adicionar 'settings.' ao início
    alternatePaths.push(`settings.${path}`);
  }
  
  // Versão com notação de array convertida
  alternatePaths.push(path.replace(/\.\d+\./g, (match) => {
    const index = match.substring(1, match.length - 1);
    return `[${index}].`;
  }));
  
  return alternatePaths;
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

// Função para teste de extração e atualização
export const testElementorJson = (json: any) => {
  console.log("Testando processamento de JSON do Elementor...");
  
  // 1. Extrair campos
  const fields = extractEditableFields(json);
  console.log(`Extraídos ${fields.length} campos editáveis`);
  fields.forEach((f, i) => console.log(`Campo ${i+1}: ${f.type} - ${f.path} = "${f.value}"`));
  
  // 2. Modificar campos (exemplo)
  const modifiedFields = fields.map(f => ({
    ...f,
    value: `${f.value} (MODIFICADO)`
  }));
  
  // 3. Reconstruir JSON
  const updatedJson = rebuildJsonWithUpdatedFields(json, modifiedFields);
  
  // 4. Verificar campos atualizados
  const newFields = extractEditableFields(updatedJson);
  console.log("\nVerificando atualizações:");
  
  newFields.forEach((f, i) => {
    const isModified = f.value?.includes("(MODIFICADO)");
    console.log(`Campo ${i+1}: ${isModified ? "✓" : "✗"} - ${f.path} = "${f.value}"`);
  });
  
  return updatedJson;
};