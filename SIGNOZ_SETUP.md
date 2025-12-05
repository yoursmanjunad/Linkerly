# SigNoz Observability Setup

I have instrumented your Frontend (Next.js) and Backend (Node.js) applications with OpenTelemetry to send data to SigNoz.

## 1. Start SigNoz
To view the traces and metrics, you need to run the SigNoz backend. The easiest way is to use their official Docker setup.
Run the following commands in a separate terminal (outside of this project directory, or in a sibling directory):

```powershell
# Clone the SigNoz repository
git clone -b main https://github.com/SigNoz/signoz.git

# Navigate to the deploy directory
cd signoz/deploy/docker/clickhouse-setup

# Start SigNoz
docker-compose up -d
```

SigNoz UI will be available at: http://localhost:3301

## 2. Start Your App
I have configured your `docker-compose.yml` to send data to SigNoz running on your host machine via `http://host.docker.internal:4318`.

Start your application as usual:

```powershell
docker-compose up --build
```

## 3. Verify
1. Open your app at http://localhost:3000 and perform some actions (create links, visit links).
2. Open SigNoz at http://localhost:3301.
3. Go to "Services" and you should see `frontend-service` and `backend-service`.
