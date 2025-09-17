
export const getInitials = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word[0])
        .filter(char => char && char.match(/[a-zA-Z]/))
        .join('')
        .toUpperCase();
};
