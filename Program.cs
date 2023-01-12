using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SignalRChat.Hubs;

using PersonalizedCardGame.Models;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Newtonsoft.Json.Serialization;
using PersonalizedCardGame.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
//builder.Services.AddMvc().AddJsonOptions(options => options.JsonSerializerOptions.ContractResolver = new DefaultContractResolver());
builder.Services.AddDbContext<DBCardGameContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DbCoreConnectionString") ?? throw new InvalidOperationException("Connection string 'DbCoreConnectionString' not found.")));
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    // This lambda determines whether user consent for non-essential cookies is needed for a given request.
    options.CheckConsentNeeded = context => true;
    options.MinimumSameSitePolicy = SameSiteMode.None;
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseCors(option =>
option.AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader()
    );

app.UseHttpsRedirection();

DefaultFilesOptions DefaultFile = new DefaultFilesOptions();
DefaultFile.DefaultFileNames.Clear();
DefaultFile.DefaultFileNames.Add("Main.html");
app.UseDefaultFiles(DefaultFile);

app.UseStaticFiles();
app.UseCookiePolicy();
app.UseRouting();
app.UseAuthorization();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapHub<MyHub>("/myHub");
app.MapHub<GameClass>("/GameClass", options =>
{
    options.Transports = HttpTransportType.WebSockets;
});

app.Run();
