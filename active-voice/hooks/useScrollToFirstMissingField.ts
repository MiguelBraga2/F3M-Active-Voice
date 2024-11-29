export function scrollToFirstMissingField<T>(
    missingFields: Array<string>,
    refs: Record<string, React.RefObject<any>>, 
    scrollToPosition: (yPosition: number) => void) {
    
    if (missingFields.length > 0) {
        const firstMissingFieldRef = refs[missingFields[0]];

        if (firstMissingFieldRef && firstMissingFieldRef.current) {
            firstMissingFieldRef.current.measure((_x: number, _y: number, _width: number, _height: number, _pageX: number, pageY: number) => {
                if (scrollToPosition) {
                    scrollToPosition(pageY);
                }
            });
        }
    }
}
