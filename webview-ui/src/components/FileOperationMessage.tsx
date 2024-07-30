import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Text, Paragraph } = Typography;

interface FileOperationProps {
    operation: {
        type: string;
        filePath: string;
        content?: string;
        insertionPoint?: string;
        code?: string;
        start?: string;
        end?: string;
        newCode?: string;
    };
}

const FileOperation: React.FC<FileOperationProps> = ({ operation }) => {
    const renderContent = () => {
        switch (operation.type) {
            case 'create':
            case 'updateFile':
                return (
                    <>
                        <Text strong>Content:</Text>
                        {/* <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                            <pre>{operation.content}</pre>
                        </Paragraph> */}
                    </>
                );
            case 'insert':
                return (
                    <>
                        <Text strong>Insertion Point:</Text> {operation.insertionPoint}
                        <Divider />
                        <Text strong>Code:</Text>
                        {/* <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                            <pre>{operation.code}</pre>
                        </Paragraph> */}
                    </>
                );
            case 'remove':
                return (
                    <>
                        <Text strong>Start:</Text> {operation.start}
                        <Divider />
                        <Text strong>End:</Text> {operation.end}
                    </>
                );
            case 'updateCode':
                return (
                    <>
                        <Text strong>Start:</Text> {operation.start}
                        <Divider />
                        <Text strong>End:</Text> {operation.end}
                        <Divider />
                        <Text strong>New Code:</Text>
                        <Paragraph style={{ overflow: 'auto', maxHeight: '15rem' }}>
                            <pre>{operation.newCode}</pre>
                        </Paragraph>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Card
            title={`${operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation`}
            size="small"
            style={{ marginBottom: 16 }}
        >
            <Text strong>File Path:</Text> {operation.filePath}
            <Divider />
            {renderContent()}
        </Card>
    );
};

export default FileOperation;