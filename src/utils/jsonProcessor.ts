
import { set, get } from "lodash";

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
      widgets.forEach((widget, index) => {
        const currentPath = basePath ? `${basePath}.widgets[${index}]` : `widgets[${index}]`;
        
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
              // We're now skipping link extraction
              break;
              
            // You can add more widget types as needed
            
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
        if (widget.elements) {
          processWidgets(widget.elements, `${currentPath}.elements`);
        } else if (widget.widgets) {
          processWidgets(widget.widgets, `${currentPath}.widgets`);
        }
      });
    };
    
    // Start processing from the top level
    if (json.widgets) {
      processWidgets(json.widgets);
    } else if (json.elements) {
      processWidgets(json.elements);
    }
    
    return result;
  } catch (error) {
    console.error("Error extracting editable fields:", error);
    throw new Error("Failed to extract editable fields from JSON");
  }
};

// Rebuild the original JSON with updated values
export const rebuildJsonWithUpdatedFields = (
  originalJson: any, 
  updatedFields: EditableField[]
): any => {
  try {
    // Create a deep copy of the original JSON
    const resultJson = JSON.parse(JSON.stringify(originalJson));
    
    // Update each field in the JSON
    updatedFields.forEach(field => {
      try {
        // Check if the path exists before updating
        if (get(resultJson, field.path) !== undefined) {
          set(resultJson, field.path, field.value);
        } else {
          console.warn(`Path not found in original JSON: ${field.path}`);
        }
      } catch (e) {
        console.error(`Error updating field at path: ${field.path}`, e);
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
