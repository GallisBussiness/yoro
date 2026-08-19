import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

const useColorMode = (): [string, (value: string) => void] => {
  const [colorMode, setColorMode] = useLocalStorage('color-theme', 'light');

  useEffect(() => {
    const className = 'dark';
    const bodyClass = window.document.body.classList;
    const html = window.document.documentElement;

    // Tailwind (class strategy) reads the `dark` class on <body>.
    if (colorMode === 'dark') bodyClass.add(className);
    else bodyClass.remove(className);

    // Mantine reads the data attribute on <html> for its dark CSS variables.
    html.setAttribute('data-mantine-color-scheme', colorMode);
    html.style.colorScheme = colorMode;
  }, [colorMode]);

  return [colorMode, setColorMode];
};

export default useColorMode;
