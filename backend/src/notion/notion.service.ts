import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotionService {
    private readonly logger = new Logger(NotionService.name);
    private notion: Client;
    private readonly databaseId: string;
    private databaseProperties: any = null;

    constructor(private configService: ConfigService) {
        const notionApiKey = this.configService.get<string>('NOTION_API_KEY');
        const databaseId = this.configService.get<string>('NOTION_DATABASE_ID');

        if (!notionApiKey) {
            this.logger.warn('NOTION_API_KEY is not set. Notion integration is disabled.');
        } else if (!databaseId) {
            this.logger.warn('NOTION_DATABASE_ID is not set. Notion integration is disabled.');
        } else {
            this.notion = new Client({ auth: notionApiKey });
            this.databaseId = databaseId;
            this.logger.log('Notion integration is enabled.');
            // Initialize database properties
            this.initDatabaseProperties();
        }
    }

    private async initDatabaseProperties() {
        try {
            const schema = await this.getDatabaseSchema();
            this.databaseProperties = schema.properties;

            // Log the property names and types
            const propertyInfo = Object.entries(schema.properties || {})
                .map(([name, prop]: [string, any]) => `${name}: ${prop.type || 'unknown'}`)
                .join(', ');

            this.logger.log(`Notion database properties: ${propertyInfo}`);
        } catch (error) {
            this.logger.error('Failed to initialize Notion database properties', error.stack);
        }
    }

    async getDatabaseSchema() {
        if (!this.notion || !this.databaseId) {
            throw new BadRequestException('Notion integration is not configured');
        }

        try {
            // Get database details
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId
            });

            // Return database properties
            return {
                properties: database.properties,
                id: database.id,
            };
        } catch (error) {
            this.logger.error(`Failed to get Notion database schema: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to get Notion database schema: ${error.message}`);
        }
    }

    // Helper function to find property name by type
    private findPropertyNameByType(type: string): string | null {
        if (!this.databaseProperties) {
            return null;
        }

        for (const [name, property] of Object.entries(this.databaseProperties)) {
            if (property && typeof property === 'object' && 'type' in property && property.type === type) {
                return name;
            }
        }
        return null;
    }

    async syncDailySummary(date: string, repoFullName: string, summary: string) {
        if (!this.notion || !this.databaseId) {
            throw new BadRequestException('Notion integration is not configured');
        }

        try {
            // If properties aren't loaded yet, try to load them
            if (!this.databaseProperties) {
                await this.initDatabaseProperties();
            }

            // Use the correct property names from the database
            const dateProperty = 'Date of Commit';  // Updated from 'Date'
            const repoProperty = 'Repository';      // Kept as is
            const titleProperty = 'Name';           // Updated from 'Title'
            const summaryProperty = 'Summary';      // New field for summary text

            this.logger.log(`Using properties - Date: ${dateProperty}, Repository: ${repoProperty}, Title: ${titleProperty}, Summary: ${summaryProperty}`);

            // Find existing page for this date and repo
            const existingPages = await this.searchExistingPage(date, repoFullName, dateProperty, repoProperty);

            if (existingPages.length > 0) {
                // Update existing page
                const pageId = existingPages[0].id;
                return this.updatePage(pageId, date, repoFullName, summary, summaryProperty);
            } else {
                // Create new page
                return this.createPage(date, repoFullName, summary, dateProperty, repoProperty, titleProperty, summaryProperty);
            }
        } catch (error) {
            this.logger.error(`Failed to sync with Notion: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to sync with Notion: ${error.message}`);
        }
    }

    private async searchExistingPage(date: string, repoFullName: string, dateProperty: string, repoProperty: string) {
        try {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    and: [
                        {
                            property: dateProperty,
                            date: {
                                equals: date,
                            },
                        },
                        {
                            property: repoProperty,
                            rich_text: {
                                equals: repoFullName,
                            },
                        },
                    ],
                },
            });

            return response.results;
        } catch (error) {
            this.logger.error(`Search error: ${error.message}. Do your Notion properties match? Date property: ${dateProperty}, Repository property: ${repoProperty}`);
            throw error;
        }
    }

    private async createPage(date: string, repoFullName: string, summary: string, dateProperty: string, repoProperty: string, titleProperty: string, summaryProperty: string) {
        const properties = {};

        // Add date property
        properties[dateProperty] = {
            date: {
                start: date,
            },
        };

        // Add repository property
        properties[repoProperty] = {
            rich_text: [
                {
                    text: {
                        content: repoFullName,
                    },
                },
            ],
        };

        // Add title property
        properties[titleProperty] = {
            title: [
                {
                    text: {
                        content: `Daily Summary for ${repoFullName} on ${date}`,
                    },
                },
            ],
        };

        // Add summary property
        properties[summaryProperty] = {
            rich_text: [
                {
                    text: {
                        content: summary.length > 2000 ? summary.substring(0, 1997) + '...' : summary,
                    },
                },
            ],
        };

        return this.notion.pages.create({
            parent: {
                database_id: this.databaseId,
            },
            properties: properties,
            children: [
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: summary,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    }

    private async updatePage(pageId: string, date: string, repoFullName: string, summary: string, summaryProperty: string) {
        // Update the page summary property
        await this.notion.pages.update({
            page_id: pageId,
            properties: {
                [summaryProperty]: {
                    rich_text: [
                        {
                            text: {
                                content: summary.length > 2000 ? summary.substring(0, 1997) + '...' : summary,
                            },
                        },
                    ],
                }
            }
        });

        // Update the page content
        await this.notion.blocks.children.append({
            block_id: pageId,
            children: [
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: summary,
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return { success: true, message: 'Summary updated in Notion' };
    }
} 