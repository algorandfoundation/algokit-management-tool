import { IoIosClose } from "react-icons/io";
import { ColorBySelection, useConfigContext } from "../config-context";
import { ChangeEvent } from "react";

type DrawerConfigProps = {
  closeDrawer: () => void;
};

export function DrawerConfig({ closeDrawer }: DrawerConfigProps) {
  const {
    showDevDependencies,
    setShowDevDependencies,
    showMismatchedVersions,
    setShowMismatchedVersions,
    uniqueAttributesMap,
    setColorBySelection,
  } = useConfigContext();
  return (
    <div className="menu bg-base-200 text-base-content min-h-full w-full max-w-[300px] p-2">
      <div className="flex justify-between items-center py-1">
        <h2 className="text-lg font-bold">Settings</h2>
        <IoIosClose style={{ width: 35, height: 35 }} onClick={closeDrawer} />
      </div>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Color By</span>
        </div>
        <select
          className="select select-bordered w-full max-w-xs capitalize"
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            console.log(event.target.value);
            setColorBySelection(event.target.value as ColorBySelection);
          }}
        >
          <option key="none">None</option>
          {Object.keys(uniqueAttributesMap).map((key) => (
            <option key={key}>{key}</option>
          ))}
        </select>
      </label>
      <ul className="menu-list">
        <li>
          <div className="form-control">
            <label className="label cursor-pointer flex gap-2">
              <input
                type="checkbox"
                checked={showDevDependencies}
                className="checkbox"
                onClick={() => setShowDevDependencies(!showDevDependencies)}
              />
              <span className="label-text">Show Dev Dependencies</span>
            </label>
          </div>
        </li>
        <li>
          <div className="form-control">
            <label className="label cursor-pointer flex gap-2">
              <input
                type="checkbox"
                checked={showMismatchedVersions}
                className="checkbox"
                onClick={() =>
                  setShowMismatchedVersions(!showMismatchedVersions)
                }
              />
              <span className="label-text">Highlight Mismatched Versions</span>
            </label>
          </div>
        </li>
      </ul>
    </div>
  );
}
