import { createContext, useContext, PropsWithChildren, useState } from "react";

interface FuncSpec {
  selectedFuncSpec: string;
  setSelectedFuncSpec: React.Dispatch<React.SetStateAction<string>>;
}

const FuncSpecContext = createContext<FuncSpec | undefined>(undefined);

export const FuncSpecContextProvider = ({ children }: PropsWithChildren) => {
  const [selectedFuncSpec, setSelectedFuncSpec] = useState("");
  return (
    <FuncSpecContext.Provider value={{ selectedFuncSpec, setSelectedFuncSpec }}>
      {children}
    </FuncSpecContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFuncSpecContext = () => {
  const context = useContext(FuncSpecContext);
  if (!context) {
    throw new Error(
      "useFuncSpecContext must be used within a FuncSpecContextProvider"
    );
  }
  return context;
};
