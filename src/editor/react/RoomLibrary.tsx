import React from 'react';
import { RoomData } from '../../room/RoomData';
import { RoomStorage } from '../../room/RoomStorage';
import styles from './RoomLibrary.module.css';

interface RoomLibraryProps {
  onLoad: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const RoomLibrary: React.FC<RoomLibraryProps> = ({ onLoad, onSave, onDelete, onClose }) => {
  const rooms = RoomStorage.getAllRooms();
  const roomIds = Object.keys(rooms).sort();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Room Library</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {roomIds.length === 0 ? (
            <div className={styles.empty}>No rooms saved yet.</div>
          ) : (
            <div className={styles.grid}>
              {roomIds.map(id => (
                <div key={id} className={styles.roomCard}>
                  <div className={styles.roomInfo}>
                    <span className={styles.roomName}>{id}</span>
                    <span className={styles.roomSize}>
                      {rooms[id].width}x{rooms[id].height}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.loadBtn} onClick={() => onLoad(id)}>Load</button>
                    <button className={styles.deleteBtn} onClick={() => onDelete(id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.saveNewBtn} onClick={() => onSave('')}>+ Save Current Room</button>
        </div>
      </div>
    </div>
  );
};

export default RoomLibrary;
