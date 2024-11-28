import "./App.css";
import { ConfigContextProvider } from "./config-context";
import { Drawer } from "./features/drawer";
import { Legend } from "./features/legend";
import { RepoNetwork } from "./features/repo-network";

function App() {
  return (
    <ConfigContextProvider>
      <div className="h-dvh">
        <div>title</div>
        <div className="absolute top-0 left-0 z-10">
          <Legend />
        </div>
        <div className="h-full w-full">
          <RepoNetwork />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Drawer />
        </div>
      </div>
    </ConfigContextProvider>
  );
}

export default App;
