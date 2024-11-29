/**
 * Define a estrutura para os campos de um formulário.
 */
export interface FieldConfig {
    name: string; // O nome do campo, usado no formulário.
    label: string; // O rótulo a ser exibido no formulário.
    component: React.ComponentType<any>; // O componente React a ser usado para o campo.
    props: Record<string, any>; // Propriedades específicas do componente.
    isRequired: boolean; // Indica se o campo é obrigatório.
    isConditional?: boolean; // Indica se o campo é condicional
    dependsOn?: { field: string; value: any }; // Campo e valor dos quais este campo depende
}