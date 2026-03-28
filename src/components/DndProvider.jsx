import { DragDropContext } from '@hello-pangea/dnd';

const DndProvider = ({ children, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
};

export default DndProvider;