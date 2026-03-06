import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersApi } from '../api/client';
import './Dashboard.css';

export default function Dashboard() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        ordersApi.getAll().then(res => setOrders(res.data)).catch(() => { });
    }, []);

    const queue = orders.filter(o => o.status === 'queue');
    const printing = orders.filter(o => o.status === 'printing');
    const postProcessing = orders.filter(o => o.status === 'post-processing');

    const tagColor = (tag) => {
        if (tag === 'PROTOTYPE') return 'badge-primary';
        if (tag === 'HIGH DETAIL') return 'badge-warning';
        if (tag === 'SANDING') return 'badge-neutral';
        return 'badge-neutral';
    };

    const OrderCard = ({ order }) => (
        <div className="order-card card">
            <div className="order-card-header">
                <span className={`badge ${tagColor(order.tag)}`}>{order.tag}</span>
                <span className="order-number">#{order.order_number}</span>
            </div>
            <div className="order-card-body">
                <div className="order-product">{order.product_name}</div>
                <div className="order-meta">
                    <span className="text-muted">{order.material}</span>
                    <span className="order-price">R$ {order.price?.toFixed(2)}</span>
                </div>
                {order.status === 'printing' && (
                    <div className="order-progress">
                        <div className="progress-info">
                            <span>{order.progress}%</span>
                            <span className="text-muted">{order.time_remaining} {t('timeRemaining')}</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${order.progress}%` }}></div>
                        </div>
                        <div className="order-printer text-muted">
                            <span className="material-icons-outlined" style={{ fontSize: 14 }}>print</span>
                            Bambu Lab X1C #01
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>{t('ordersCommissions')}</h1>
                        <p>{t('ordersSubtitle')}</p>
                    </div>
                    <button className="btn btn-primary">
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>add</span>
                        {t('newOrder')}
                    </button>
                </div>
            </div>

            <div className="kanban-board">
                <div className="kanban-column">
                    <div className="kanban-header">
                        <h3>{t('queue')}</h3>
                        <span className="badge badge-neutral">{queue.length}</span>
                    </div>
                    <div className="kanban-cards">
                        {queue.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="kanban-header">
                        <h3>{t('printing')}</h3>
                        <span className="badge badge-primary">{printing.length}</span>
                        {printing.length > 0 && <span className="badge badge-success">{printing.length} {t('active')}</span>}
                    </div>
                    <div className="kanban-cards">
                        {printing.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="kanban-header">
                        <h3>{t('postProcessing')}</h3>
                        <span className="badge badge-neutral">{postProcessing.length}</span>
                        {postProcessing.length > 0 && <span className="badge badge-warning">{postProcessing.length} {t('pending')}</span>}
                    </div>
                    <div className="kanban-cards">
                        {postProcessing.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
