import {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useMemo,
} from "react";
import { ScaleOrdinal } from "d3";
import { scaleOrdinal } from "@visx/scale";
import { GraphData } from "./components/network/types";

type UniqueAttributesMap = {
  owner: Record<string, number>;
  type: Record<string, number>;
  language: Record<string, number>;
};
export type ColorBySelection = keyof UniqueAttributesMap | "none";

interface Config {
  showDevDependencies: boolean;
  setShowDevDependencies: React.Dispatch<React.SetStateAction<boolean>>;
  showMismatchedVersions: boolean;
  setShowMismatchedVersions: React.Dispatch<React.SetStateAction<boolean>>;
  colorBySelection: ColorBySelection;
  setColorBySelection: React.Dispatch<React.SetStateAction<ColorBySelection>>;
  uniqueAttributesMap: UniqueAttributesMap;
  colorMap: ScaleOrdinal<string, string>;
}

const ConfigContext = createContext<Config | undefined>(undefined);

const colorRange = ["#66d981", "#71f5ef", "#4899f1", "#7d81f6"];

type ConfigContextProviderProps = {
  data: GraphData;
};

export const ConfigContextProvider = ({
  data,
  children,
}: PropsWithChildren<ConfigContextProviderProps>) => {
  const [showDevDependencies, setShowDevDependencies] = useState(true);
  const [showMismatchedVersions, setShowMismatchedVersions] = useState(false);
  const [colorBySelection, setColorBySelection] =
    useState<ColorBySelection>("none");

  const uniqueAttributesMap = useMemo(() => {
    const initialAccumulator = {
      owner: {} as Record<string, number>,
      type: {} as Record<string, number>,
      language: {} as Record<string, number>,
    };

    const result = data.nodes.reduce((acc, node) => {
      acc.owner[node.owner] = (acc.owner[node.owner] || 0) + 1;
      acc.type[node.type] = (acc.type[node.type] || 0) + 1;
      acc.language[node.language] = (acc.language[node.language] || 0) + 1;
      return acc;
    }, initialAccumulator);
    return result;
  }, [data.nodes]);

  const uniqueAttributes = useMemo(() => {
    if (colorBySelection in uniqueAttributesMap) {
      return uniqueAttributesMap[colorBySelection as keyof UniqueAttributesMap];
    }
    return {};
  }, [uniqueAttributesMap, colorBySelection]);
  const colorMap = useMemo(
    () =>
      scaleOrdinal({
        domain: Object.keys(uniqueAttributes),
        range: colorRange.slice(0, Object.keys(uniqueAttributes).length),
      }),
    [uniqueAttributes]
  );

  return (
    <ConfigContext.Provider
      value={{
        showDevDependencies,
        setShowDevDependencies,
        showMismatchedVersions,
        setShowMismatchedVersions,
        colorBySelection,
        setColorBySelection,
        uniqueAttributesMap,
        colorMap,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error(
      "useConfigContext must be used within a ConfigContextProvider"
    );
  }
  return context;
};
