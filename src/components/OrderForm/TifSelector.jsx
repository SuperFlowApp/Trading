import React, { useState } from 'react';
import { Dropdown, Menu, Button } from 'antd';

const TIF_OPTIONS = [
    { key: '1', label: 'GTC' },
    { key: '2', label: 'IOL' },
    { key: '3', label: 'ALO' },
];

function TifSelector({ value, onChange }) {
    // Always have a valid selection, default to first option
    const [selected, setSelected] = useState(value || TIF_OPTIONS[0].label);
    const selectedKey = TIF_OPTIONS.find(opt => opt.label === selected)?.key || TIF_OPTIONS[0].key;

    const handleMenuClick = ({ key }) => {
        const selectedLabel = TIF_OPTIONS.find(opt => opt.key === key)?.label || TIF_OPTIONS[0].label;
        setSelected(selectedLabel);
        if (onChange) onChange(selectedLabel);
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
            <Dropdown overlay={menu} trigger={['click']}>
                <Button className="TifSelector h-[28px]">
                    {selected}
                </Button>
            </Dropdown>
        </div>
    );
}

export default TifSelector;