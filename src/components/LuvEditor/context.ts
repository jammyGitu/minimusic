// context.ts - React Context 定义

import { createContext } from 'react';
import { Commands } from './commands';
import { MODE } from './types';

export interface LinkComponentProps {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}

export interface ConfigContextType {
  theme: {
    primary: string;
  };
  mode: MODE;
  linkComp?: React.FC<LinkComponentProps>;
}

// Commands 上下文
export const CommandsContext = createContext<Commands | null>(null);

// Config 上下文
export const ConfigContext = createContext<Partial<ConfigContextType>>({});
