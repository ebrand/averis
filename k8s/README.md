# Kubernetes Deployment for Commerce System

## Prerequisites

### 1. Install Local Kubernetes (Choose One)

**Docker Desktop (Recommended for Mac)**
```bash
# Enable Kubernetes in Docker Desktop Settings
# Preferences > Kubernetes > Enable Kubernetes
```

**Minikube**
```bash
brew install minikube
minikube start --memory=8192 --cpus=4 --disk-size=50g
minikube addons enable ingress
minikube addons enable metrics-server
```

**Kind**
```bash
brew install kind
kind create cluster --name commerce
```

### 2. Install kubectl
```bash
brew install kubectl
```

### 3. Verify Setup
```bash
kubectl cluster-info
kubectl get nodes
```

## Deployment Steps

### 1. Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. Deploy Infrastructure
```bash
# PostgreSQL database
kubectl apply -f postgresql.yaml

# RabbitMQ message broker
kubectl apply -f rabbitmq.yaml

# Wait for infrastructure to be ready
kubectl get pods -n commerce-dev --watch
```

### 3. Deploy Application Services
```bash
# Product MDM API
kubectl apply -f product-mdm-api.yaml

# System Monitor
kubectl apply -f system-monitor.yaml
```

### 4. Setup Ingress (Optional)
```bash
# Enable ingress controller (for minikube)
minikube addons enable ingress

# Deploy ingress
kubectl apply -f ingress.yaml

# Add to /etc/hosts
echo "$(minikube ip) commerce.local" | sudo tee -a /etc/hosts
```

### 5. Enable Autoscaling (Optional)
```bash
# Deploy HPA
kubectl apply -f hpa-example.yaml
```

## Accessing Services

### Port Forwarding (Quick Access)
```bash
# System Monitor
kubectl port-forward -n commerce-dev svc/system-monitor-service 3006:3006

# RabbitMQ Management
kubectl port-forward -n commerce-dev svc/rabbitmq-management 15672:15672

# Product MDM API
kubectl port-forward -n commerce-dev svc/product-mdm-api-service 6001:6001
```

### Via Ingress (if configured)
- System Monitor: http://commerce.local/monitor
- RabbitMQ Management: http://commerce.local/rabbitmq
- Product API: http://commerce.local/api/product-mdm

## Monitoring and Debugging

### View Logs
```bash
# All pods in namespace
kubectl logs -n commerce-dev -l app=product-mdm-api

# Follow logs
kubectl logs -n commerce-dev -f deployment/product-mdm-api
```

### Check Pod Status
```bash
kubectl get pods -n commerce-dev
kubectl describe pod -n commerce-dev <pod-name>
```

### Scale Services
```bash
# Manual scaling
kubectl scale -n commerce-dev deployment/product-mdm-api --replicas=3

# Check HPA status
kubectl get hpa -n commerce-dev
```

### Resource Usage
```bash
kubectl top pods -n commerce-dev
kubectl top nodes
```

## Exploring Kubernetes Patterns

### 1. Rolling Updates
```bash
# Update image tag (simulate deployment)
kubectl set image -n commerce-dev deployment/product-mdm-api api=node:19-alpine

# Watch rollout
kubectl rollout status -n commerce-dev deployment/product-mdm-api
```

### 2. Config Management
```bash
# Create ConfigMap
kubectl create configmap -n commerce-dev app-config --from-literal=LOG_LEVEL=debug

# Create Secret
kubectl create secret generic -n commerce-dev db-secret --from-literal=password=supersecret
```

### 3. Health Checks
```bash
# Check readiness/liveness probes
kubectl describe pod -n commerce-dev <pod-name>
```

### 4. Network Policies (Advanced)
```bash
# Apply network segmentation
kubectl apply -f network-policy.yaml
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace commerce-dev

# Or delete individual components
kubectl delete -f .
```

## Advanced Exploration

### Service Mesh with Istio
```bash
# Install Istio
curl -L https://istio.io/downloadIstio | sh -
istioctl install --set values.defaultRevision=default
kubectl label namespace commerce-dev istio-injection=enabled
```

### Monitoring with Prometheus
```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

### GitOps with ArgoCD
```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

This setup gives you a complete Kubernetes learning environment using your existing commerce system!