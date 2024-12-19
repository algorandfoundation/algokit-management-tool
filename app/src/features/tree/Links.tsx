import { Group } from "@visx/group";
import { motion, AnimatePresence } from "framer-motion";

import Link from "./Link";
import { NodeData } from "./types";
import { HierarchyPointLink } from "@visx/hierarchy/lib/types";

interface LinksProps {
  links: HierarchyPointLink<NodeData>[];
}

function Links({ links }: LinksProps) {
  return (
    <Group>
      <AnimatePresence>
        {links.map((link) => {
          const key = `${link.source.data.name}_${link.target.data.name}`;
          return (
            <motion.g
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link data={link} />
            </motion.g>
          );
        })}
      </AnimatePresence>
    </Group>
  );
}

export default Links;
