export interface IMetadata {
    author: string;
    description: string;
    repositoryUrl: string;
    createdAt: string;
    imageURL: string;
    requirementsTags: IRequirementTag[];
}

export interface IRequirementTag {
    type: string;
    value: string;
    description: string
}