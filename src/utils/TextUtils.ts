import { parse, format } from 'date-fns';

export const formatText = (text: string): string => {
    return text
      .split(' ')
      .map((word) => {
        const firstChar = word.charAt(0).toUpperCase();
        const restOfWord = word.slice(1).toLowerCase();
        return firstChar + restOfWord;
      })
      .join(' ');
  };
  
  export const formatDate = (birthday: string): string | null => {
    try {
      const dateFormats = ['MMMM dd yyyy', 'dd MMMM yyyy', 'yyyy-MM-dd'];
  
      for (const formatString of dateFormats) {
        const parsedDate = parse(birthday, formatString, new Date());
        if (!isNaN(parsedDate.getTime())) {
          return format(parsedDate, 'yyyy-MM-dd');
        }
      }
  
      return null;
    } catch (error) {
      return null;
    }
  };
  