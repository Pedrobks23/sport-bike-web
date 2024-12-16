import { DragDropContext } from 'react-beautiful-dnd';

const DndProvider = ({ children, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
};

export default DndProvider;