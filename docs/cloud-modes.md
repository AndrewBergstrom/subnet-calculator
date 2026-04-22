# Cloud Modes

The subnet calculator supports three modes that affect how usable host counts are calculated. Cloud providers reserve certain IP addresses within each subnet for internal services.

## Standard Mode

The default mode for general-purpose subnet planning.

**Reserved per subnet:** 2 IPs
- Network address (first IP, e.g., `10.0.0.0`)
- Broadcast address (last IP, e.g., `10.0.0.255`)

**Example — /24 subnet (256 total addresses):**
| Address         | Purpose          |
|----------------|------------------|
| `10.0.0.0`     | Network address  |
| `10.0.0.1`     | First usable     |
| `10.0.0.254`   | Last usable      |
| `10.0.0.255`   | Broadcast        |

Usable hosts: **254**

## Azure Mode

Use this when planning Azure Virtual Networks (VNets).

**Reserved per subnet:** 5 IPs
- `x.x.x.0` — Network address
- `x.x.x.1` — Reserved by Azure for the default gateway
- `x.x.x.2, x.x.x.3` — Reserved by Azure for mapping Azure DNS IPs
- `x.x.x.255` — Broadcast address

**Example — /24 subnet (256 total addresses):**
| Address         | Purpose                      |
|----------------|------------------------------|
| `10.0.0.0`     | Network address              |
| `10.0.0.1`     | Default gateway (Azure)      |
| `10.0.0.2`     | Azure DNS mapping            |
| `10.0.0.3`     | Azure DNS mapping            |
| `10.0.0.4`     | **First usable**             |
| `10.0.0.254`   | **Last usable**              |
| `10.0.0.255`   | Broadcast                    |

Usable hosts: **251**

### Azure subnet size considerations

Azure has a minimum subnet size of `/29` (8 addresses, 3 usable) for most services. Some services require larger subnets:

| Azure Service          | Minimum Subnet Size |
|-----------------------|-------------------|
| VPN Gateway           | /27               |
| Application Gateway   | /24 (recommended) |
| Azure Firewall        | /26               |
| Azure Bastion         | /26               |
| AKS Node Pool         | Varies by node count |

**Reference:** [Azure VNet FAQ](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq)

## AWS Mode

Use this when planning AWS Virtual Private Clouds (VPCs).

**Reserved per subnet:** 5 IPs
- `x.x.x.0` — Network address
- `x.x.x.1` — Reserved by AWS for the VPC router
- `x.x.x.2` — Reserved by AWS for DNS
- `x.x.x.3` — Reserved by AWS for future use
- `x.x.x.255` — Broadcast address

**Example — /24 subnet (256 total addresses):**
| Address         | Purpose                      |
|----------------|------------------------------|
| `10.0.0.0`     | Network address              |
| `10.0.0.1`     | VPC router (AWS)             |
| `10.0.0.2`     | AWS DNS                      |
| `10.0.0.3`     | Reserved for future use      |
| `10.0.0.4`     | **First usable**             |
| `10.0.0.254`   | **Last usable**              |
| `10.0.0.255`   | Broadcast                    |

Usable hosts: **251**

### AWS VPC CIDR limits

- VPC CIDR range: `/16` to `/28`
- Subnet CIDR range: `/16` to `/28`
- A VPC can have up to 5 CIDRs (primary + 4 secondary)

**Reference:** [AWS VPC Sizing](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html)

## Special Cases

### /31 subnets (point-to-point links)
Per [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021), `/31` subnets have 2 addresses and both are usable. There is no network or broadcast address. This is commonly used for point-to-point router links.

The calculator shows **2 usable hosts** for `/31` regardless of cloud mode.

### /32 subnets (host routes)
A `/32` has exactly 1 address — it represents a single host. The calculator shows **1 usable host** regardless of cloud mode.

## Switching Modes

Click the **Standard / Azure / AWS** toggle in the header. The active button shows how many IPs are reserved (e.g., "5 reserved"). All host counts and summary statistics update immediately.

Your selected mode is preserved when you export and restored when you import.
