using System.Text.Json.Serialization;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Hierarchical tree structure for Region-Currency-Locale management
/// Provides an intuitive tree view for administrative interface
/// </summary>
public class RegionLocaleTreeDto
{
    /// <summary>
    /// Node identifier
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Display name for the node
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Node type for UI rendering and behavior
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public NodeType Type { get; set; }

    /// <summary>
    /// Additional metadata for the node
    /// </summary>
    public NodeMetadata Metadata { get; set; } = new();

    /// <summary>
    /// Child nodes in the hierarchy
    /// </summary>
    public List<RegionLocaleTreeDto> Children { get; set; } = new();

    /// <summary>
    /// Indicates if this node is expanded in the UI
    /// </summary>
    public bool IsExpanded { get; set; } = true;

    /// <summary>
    /// Indicates if this node is selected in the UI
    /// </summary>
    public bool IsSelected { get; set; } = false;

    /// <summary>
    /// Indicates if this node can have children
    /// </summary>
    public bool CanHaveChildren { get; set; } = true;

    /// <summary>
    /// Icon to display for this node type
    /// </summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>
    /// CSS classes for styling the node
    /// </summary>
    public string CssClass { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if operations are allowed on this node
    /// </summary>
    public bool IsReadOnly { get; set; } = false;
}

/// <summary>
/// Types of nodes in the region-locale tree
/// </summary>
public enum NodeType
{
    /// <summary>
    /// Root level - represents a geographic region (AMER, EMEA, APJ, LA)
    /// </summary>
    Region,

    /// <summary>
    /// Second level - represents currencies used in the region
    /// </summary>
    Currency,

    /// <summary>
    /// Third level - represents specific locales using that currency
    /// </summary>
    Locale,

    /// <summary>
    /// Special node for grouping or organizational purposes
    /// </summary>
    Group
}

/// <summary>
/// Additional metadata for tree nodes
/// </summary>
public class NodeMetadata
{
    /// <summary>
    /// Entity ID from the database
    /// </summary>
    public Guid? EntityId { get; set; }

    /// <summary>
    /// Short code or identifier
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Description or additional information
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Number of items affected by operations on this node
    /// </summary>
    public int ItemCount { get; set; } = 0;

    /// <summary>
    /// Status information (active, inactive, etc.)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Country/region flag emoji or image URL
    /// </summary>
    public string Flag { get; set; } = string.Empty;

    /// <summary>
    /// Currency symbol for display
    /// </summary>
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// Native name for locales
    /// </summary>
    public string NativeName { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if locale is right-to-left
    /// </summary>
    public bool IsRtl { get; set; } = false;

    /// <summary>
    /// Number of catalogs that would be affected
    /// </summary>
    public int CatalogCount { get; set; } = 0;

    /// <summary>
    /// Number of products that would need localization
    /// </summary>
    public int ProductCount { get; set; } = 0;

    /// <summary>
    /// Estimated cost impact for operations
    /// </summary>
    public decimal? EstimatedCost { get; set; }

    /// <summary>
    /// Additional key-value data
    /// </summary>
    public Dictionary<string, object> AdditionalData { get; set; } = new();
}

/// <summary>
/// Request DTO for tree operations (add, move, delete nodes)
/// </summary>
public class TreeOperationRequest
{
    /// <summary>
    /// Type of operation to perform
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TreeOperation Operation { get; set; }

    /// <summary>
    /// Source node ID (for move operations)
    /// </summary>
    public string? SourceNodeId { get; set; }

    /// <summary>
    /// Target parent node ID
    /// </summary>
    public string? TargetParentId { get; set; }

    /// <summary>
    /// Data for creating new nodes
    /// </summary>
    public RegionLocaleTreeDto? NodeData { get; set; }

    /// <summary>
    /// Additional operation parameters
    /// </summary>
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// Types of tree operations
/// </summary>
public enum TreeOperation
{
    /// <summary>
    /// Add a new node
    /// </summary>
    Add,

    /// <summary>
    /// Move an existing node to a new parent
    /// </summary>
    Move,

    /// <summary>
    /// Delete a node (and optionally its children)
    /// </summary>
    Delete,

    /// <summary>
    /// Update node properties
    /// </summary>
    Update,

    /// <summary>
    /// Bulk operation on multiple nodes
    /// </summary>
    Bulk
}

/// <summary>
/// Response for tree operations with impact analysis
/// </summary>
public class TreeOperationResponse
{
    /// <summary>
    /// Indicates if the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if operation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Updated tree structure after operation
    /// </summary>
    public RegionLocaleTreeDto? UpdatedTree { get; set; }

    /// <summary>
    /// Impact analysis of the operation
    /// </summary>
    public OperationImpact Impact { get; set; } = new();
}

/// <summary>
/// Analysis of the impact of tree operations
/// </summary>
public class OperationImpact
{
    /// <summary>
    /// Number of catalogs affected
    /// </summary>
    public int AffectedCatalogs { get; set; }

    /// <summary>
    /// Number of products requiring localization
    /// </summary>
    public int AffectedProducts { get; set; }

    /// <summary>
    /// Estimated processing time
    /// </summary>
    public string EstimatedTime { get; set; } = string.Empty;

    /// <summary>
    /// Estimated cost
    /// </summary>
    public decimal EstimatedCost { get; set; }

    /// <summary>
    /// Detailed breakdown of changes
    /// </summary>
    public List<string> ChangeDetails { get; set; } = new();

    /// <summary>
    /// Warnings about potential issues
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}