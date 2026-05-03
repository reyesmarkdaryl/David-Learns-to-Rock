import React, { useEffect, useState } from 'react';
import styles from './TilesetBrowser.module.css'; // Temporarily reusing styles until we create a dedicated one

interface AssetItem {
  name: string;
  path: string;
  tileSize: number;
}

interface TilesetBrowserProps {
  onConfirm: (img: HTMLImageElement, name: string, tileSize: number, path: string) => void;
  onCancel: () => void;
}

const TilesetBrowser: React.FC<TilesetBrowserProps> = ({ onConfirm, onCancel }) => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/assets/tilemaps/manifest.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load asset manifest');
        return res.json();
      })
      .then(data => {
        setAssets(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selectAsset = (asset: AssetItem) => {
    const img = new Image();
    img.src = `/${asset.path}`;
    img.onload = () => {
      onConfirm(img, asset.name, asset.tileSize, asset.path);
    };
    img.onerror = () => {
      alert(`Failed to load image: ${asset.path}`);
    };
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.title}>Select Tileset</div>
        <div className={styles.sub}>Choose an asset from the project library</div>

        {loading ? (
          <div className={styles.hint}>Loading assets...</div>
        ) : error ? (
          <div className={styles.hint}>✗ {error}</div>
        ) : (
          <div className={styles.assetGrid}>
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className={styles.assetItem}
                onClick={() => selectAsset(asset)}
                title={asset.name}
              >
                <div className={styles.assetPreview}>
                  <img src={`/${asset.path}`} alt={asset.name} />
                </div>
                <div className={styles.assetName}>{asset.name}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TilesetBrowser;
