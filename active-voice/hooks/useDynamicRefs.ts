import React, { useRef } from 'react';

/**
 * Hook para gerenciar referências dinâmicas.
 * @returns Um objeto com dois métodos:
 * - `getRef`: Recupera ou cria uma referência para um identificador.
 * - `refs`: Todas as referências criadas.
 */
export function useDynamicRefs<T>() {
    const refs = useRef<{ [key: string]: React.RefObject<T> }>({});

    /**
     * Retorna a referência existente ou cria uma nova se ainda não existir.
     * @param name Nome ou chave única para a referência.
     * @returns A referência correspondente.
     */
    const getRef = (name: string): React.RefObject<T> => {
        if (!refs.current[name]) {
            refs.current[name] = React.createRef<T>();
        }
        return refs.current[name];
    };

    return { getRef, refs: refs.current };
}