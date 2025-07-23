import React, { useState } from 'react';
import { Dropdown, Menu, Button } from 'antd';

const TIF_OPTIONS = [
    { key: '1', label: 'GTC' },
    { key: '2', label: 'IOL' },
    { key: '3', label: 'ALO' },
];

function TifSelector({ value, onChange }) {
    const [selected, setSelected] = useState(value || TIF_OPTIONS[0].label);
    const [open, setOpen] = useState(false); // <-- Add open state
    const selectedKey = TIF_OPTIONS.find(opt => opt.label === selected)?.key || TIF_OPTIONS[0].key;

    const handleMenuClick = ({ key }) => {
        const selectedLabel = TIF_OPTIONS.find(opt => opt.key === key)?.label || TIF_OPTIONS[0].label;
        setSelected(selectedLabel);
        if (onChange) onChange(selectedLabel);
        setOpen(false); // Close dropdown after selection
    };

    const menu = (
        <Menu onClick={handleMenuClick} selectedKeys={[selectedKey]}>
            {TIF_OPTIONS.map(opt => (
                <Menu.Item key={opt.key}>{opt.label}</Menu.Item>
            ))}
        </Menu>
    );

    return (
        <div className="my-2">
            <Dropdown
                overlay={menu}
                trigger={['click']}
                open={open}
                onOpenChange={setOpen}
            >
                <Button
                    className={`TifSelector h-[28px]${open ? ' TifSelector-open' : ''}`}
                >
                    {selected}
                </Button>
            </Dropdown>
        </div>
    );
}

export default TifSelector;