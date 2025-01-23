import { motion } from "framer-motion";
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoClose,
} from "react-icons/io5";

interface DrawerProps {
  open: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function MotionDrawer({
  open,
  isExpanded,
  setIsExpanded,
  onClose,
  children,
}: DrawerProps) {
  return (
    <motion.div
      initial={{ y: "100vh" }}
      animate={{
        y: open ? "0vh" : "100vh",
        height: isExpanded ? "100vh" : "60vh",
      }}
      transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 p-2 rounded-t-sm shadow-lg z-10 bg-base-100"
      style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.1)" }}
    >
      {children}

      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-ghost"
          aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
        >
          {isExpanded ? (
            <IoChevronDownOutline className="h-6 w-6" />
          ) : (
            <IoChevronUpOutline className="h-6 w-6" />
          )}
        </button>

        <button
          onClick={onClose}
          className="btn btn-ghost"
          aria-label="Close drawer"
        >
          <IoClose className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}
