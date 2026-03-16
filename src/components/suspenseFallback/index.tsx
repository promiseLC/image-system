import styles from './index.module.scss';

const SuspenseFallback = () => (
  <div className={styles.wrapper}>
    <span className={styles.content}>加载中...</span>
  </div>
);

export default SuspenseFallback;
